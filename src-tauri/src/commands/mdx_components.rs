use crate::models::{MdxComponent, PropInfo};
use std::fs;
use std::path::Path;
use std::rc::Rc;
use swc_common::sync::Lrc;
use swc_common::{FileName, SourceMap};
use swc_ecma_ast::*;
use swc_ecma_parser::{parse_file_as_module, Syntax, TsSyntax};
use swc_ecma_ast::EsVersion;
use swc_ecma_visit::{Visit, VisitWith};
use walkdir::WalkDir;

#[tauri::command]
pub async fn scan_mdx_components(project_path: String) -> Result<Vec<MdxComponent>, String> {
    let mdx_dir = Path::new(&project_path).join("src/components/mdx");
    
    if !mdx_dir.exists() {
        return Ok(vec![]);
    }
    
    let mut components = Vec::new();
    
    for entry in WalkDir::new(&mdx_dir)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        
        // Only process .astro files
        if path.extension().and_then(|s| s.to_str()) != Some("astro") {
            continue;
        }
        
        // Skip index files
        if path.file_stem().and_then(|s| s.to_str()) == Some("index") {
            continue;
        }
        
        match parse_astro_component(path, &project_path) {
            Ok(component) => components.push(component),
            Err(e) => eprintln!("Error parsing {}: {e}", path.display()),
        }
    }
    
    Ok(components)
}

fn parse_astro_component(path: &Path, project_root: &str) -> Result<MdxComponent, String> {
    let content = fs::read_to_string(path)
        .map_err(|e| format!("Failed to read file: {e}"))?;
    
    // Extract component name from filename
    let component_name = path
        .file_stem()
        .and_then(|s| s.to_str())
        .ok_or("Invalid filename")?
        .to_string();
    
    // Extract frontmatter (TypeScript code between ---) 
    let frontmatter = extract_frontmatter(&content)?;
    
    // Parse TypeScript AST
    let props = parse_props_from_typescript(&frontmatter)?;
    
    // Check for <slot /> in the template part
    let has_slot = content.contains("<slot") || content.contains("<slot/>");
    
    // Calculate relative path
    let relative_path = path.strip_prefix(project_root)
        .unwrap_or(path)
        .to_string_lossy()
        .to_string();
    
    Ok(MdxComponent {
        name: component_name,
        file_path: relative_path,
        props,
        has_slot,
        description: None, // TODO: Extract from JSDoc comments
    })
}

fn extract_frontmatter(content: &str) -> Result<String, String> {
    let parts: Vec<&str> = content.split("---").collect();
    
    if parts.len() < 3 {
        return Err("No frontmatter found".to_string());
    }
    
    Ok(parts[1].to_string())
}

fn parse_props_from_typescript(typescript_code: &str) -> Result<Vec<PropInfo>, String> {
    // Create a source map (required by swc)
    let cm = Lrc::new(SourceMap::default());
    
    // Create a file source
    let fm = cm.new_source_file(
        Rc::new(FileName::Custom("props.ts".into())),
        typescript_code.to_string(),
    );
    
    // Parse the TypeScript code
    let syntax = Syntax::Typescript(TsSyntax {
        tsx: true,
        decorators: false,
        ..Default::default()
    });
    
    let module = parse_file_as_module(
        &fm,
        syntax,
        EsVersion::Es2022,
        None,
        &mut vec![],
    )
    .map_err(|e| format!("Failed to parse TypeScript: {e:?}"))?;
    
    // Find Props interface
    let mut visitor = PropsVisitor {
        props: Vec::new(),
    };
    
    module.visit_with(&mut visitor);
    
    Ok(visitor.props)
}

struct PropsVisitor {
    props: Vec<PropInfo>,
}

impl Visit for PropsVisitor {
    fn visit_ts_interface_decl(&mut self, node: &TsInterfaceDecl) {
        // Look for interface named "Props"
        if node.id.sym.as_str() == "Props" {
            for member in &node.body.body {
                if let TsTypeElement::TsPropertySignature(prop) = member {
                    if let Some(prop_info) = extract_prop_info(prop) {
                        self.props.push(prop_info);
                    }
                }
            }
        }
    }
}

fn extract_prop_info(prop: &TsPropertySignature) -> Option<PropInfo> {
    // Extract property name
    let name = match prop.key.as_ref() {
        Expr::Ident(ident) => ident.sym.to_string(),
        _ => return None,
    };
    
    // Check if optional
    let is_optional = prop.optional;
    
    // Extract type as string
    let prop_type = if let Some(type_ann) = &prop.type_ann {
        type_to_string(&type_ann.type_ann)
    } else {
        "unknown".to_string()
    };
    
    Some(PropInfo {
        name,
        prop_type,
        is_optional,
        default_value: None, // TODO: Extract default values from AST
    })
}

fn type_to_string(ts_type: &TsType) -> String {
    match ts_type {
        TsType::TsKeywordType(keyword) => match keyword.kind {
            TsKeywordTypeKind::TsStringKeyword => "string".to_string(),
            TsKeywordTypeKind::TsNumberKeyword => "number".to_string(),
            TsKeywordTypeKind::TsBooleanKeyword => "boolean".to_string(),
            TsKeywordTypeKind::TsAnyKeyword => "any".to_string(),
            _ => "unknown".to_string(),
        },
        TsType::TsLitType(lit) => match &lit.lit {
            TsLit::Str(s) => format!("'{}'", s.value),
            TsLit::Number(n) => n.value.to_string(),
            TsLit::Bool(b) => b.value.to_string(),
            _ => "literal".to_string(),
        },
        TsType::TsUnionOrIntersectionType(union) => {
            if let TsUnionOrIntersectionType::TsUnionType(union_type) = union {
                union_type.types.iter()
                    .map(|t| type_to_string(t))
                    .collect::<Vec<_>>()
                    .join(" | ")
            } else {
                "intersection".to_string()
            }
        },
        TsType::TsTypeRef(type_ref) => {
            if let TsEntityName::Ident(ident) = &type_ref.type_name {
                ident.sym.to_string()
            } else {
                "unknown".to_string()
            }
        },
        TsType::TsArrayType(array_type) => {
            format!("{}[]", type_to_string(&array_type.elem_type))
        },
        _ => "unknown".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    #[test]
    fn test_parse_props_from_typescript() {
        let typescript_code = r#"
            interface Props {
                title: string;
                type?: 'warning' | 'info' | 'error';
                isOpen: boolean;
                count?: number;
            }
        "#;
        
        let props = parse_props_from_typescript(typescript_code).unwrap();
        
        assert_eq!(props.len(), 4);
        
        assert_eq!(props[0].name, "title");
        assert_eq!(props[0].prop_type, "string");
        assert!(!props[0].is_optional);
        
        assert_eq!(props[1].name, "type");
        assert!(props[1].prop_type.contains("warning"));
        assert!(props[1].is_optional);
        
        assert_eq!(props[2].name, "isOpen");
        assert_eq!(props[2].prop_type, "boolean");
        assert!(!props[2].is_optional);
        
        assert_eq!(props[3].name, "count");
        assert_eq!(props[3].prop_type, "number");
        assert!(props[3].is_optional);
    }
    
    #[tokio::test]
    async fn test_scan_mdx_components() {
        let temp_dir = TempDir::new().unwrap();
        let mdx_dir = temp_dir.path().join("src/components/mdx");
        fs::create_dir_all(&mdx_dir).unwrap();
        
        // Create a test component
        let component_content = r#"---
interface Props {
    message: string;
    variant?: 'primary' | 'secondary';
}
---

<div class="alert">
    <slot />
</div>"#;
        
        fs::write(mdx_dir.join("Alert.astro"), component_content).unwrap();
        
        let components = scan_mdx_components(temp_dir.path().to_str().unwrap().to_string())
            .await
            .unwrap();
        
        assert_eq!(components.len(), 1);
        assert_eq!(components[0].name, "Alert");
        assert_eq!(components[0].props.len(), 2);
        assert!(components[0].has_slot);
    }
}