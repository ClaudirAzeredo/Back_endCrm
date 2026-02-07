import { BuilderElement } from "@/lib/types/builder-types";

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  elements: BuilderElement[];
}

export const TEMPLATES: Template[] = [
  {
    id: "blank",
    name: "Em Branco",
    description: "Comece do zero e construa sua página exatamente como você quer.",
    category: "all",
    thumbnail: "/templates/blank.png",
    elements: [
      {
        id: "section-1",
        type: "section",
        styles: { 
          padding: "60px 20px", 
          backgroundColor: "#ffffff" 
        },
        children: [
          {
            id: "container-1",
            type: "container",
            styles: { 
              maxWidth: "1200px", 
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            },
            children: [
              {
                id: "heading-1",
                type: "heading",
                content: "Comece a editar...",
                styles: { 
                  textAlign: "center", 
                  fontSize: "3rem", 
                  fontWeight: "bold",
                  color: "#1e293b"
                }
              },
              {
                id: "paragraph-1",
                type: "paragraph",
                content: "Arraste elementos do menu lateral para construir sua página.",
                styles: { 
                  textAlign: "center", 
                  fontSize: "1.125rem",
                  color: "#64748b"
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "lead-capture-simple",
    name: "Captura Simples",
    description: "Foco total na conversão com título forte e formulário.",
    category: "lead-generation",
    thumbnail: "/templates/lead-simple.png",
    elements: [
      {
        id: "section-hero",
        type: "section",
        styles: { 
          padding: "80px 20px", 
          backgroundColor: "#f8fafc",
          minHeight: "600px",
          display: "flex",
          alignItems: "center"
        },
        children: [
          {
            id: "container-hero",
            type: "container",
            styles: { 
              maxWidth: "1000px", 
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "40px",
              alignItems: "center"
            },
            children: [
              {
                id: "column-left",
                type: "container",
                styles: { display: "flex", flexDirection: "column", gap: "20px" },
                children: [
                  {
                    id: "heading-hero",
                    type: "heading",
                    content: "Transforme Visitantes em Leads Qualificados",
                    styles: { 
                      fontSize: "3.5rem", 
                      fontWeight: "800",
                      lineHeight: "1.2",
                      color: "#0f172a"
                    }
                  },
                  {
                    id: "text-hero",
                    type: "paragraph",
                    content: "Ofereça algo de valor e capture as informações de contato do seu público-alvo com esta página de alta conversão.",
                    styles: { 
                      fontSize: "1.25rem",
                      color: "#475569",
                      lineHeight: "1.6"
                    }
                  }
                ]
              },
              {
                id: "column-right",
                type: "container",
                styles: { 
                  backgroundColor: "#ffffff",
                  padding: "30px",
                  borderRadius: "12px",
                  boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)"
                },
                children: [
                  {
                    id: "form-heading",
                    type: "heading",
                    content: "Cadastre-se Agora",
                    styles: { 
                      fontSize: "1.5rem", 
                      textAlign: "center",
                      marginBottom: "20px"
                    }
                  },
                  {
                    id: "hero-form",
                    type: "form",
                    props: {
                      submitText: "Quero Receber",
                      fields: [
                        { id: "name", type: "text", label: "Nome Completo", placeholder: "Seu nome", required: true },
                        { id: "email", type: "email", label: "E-mail Profissional", placeholder: "seu@email.com", required: true }
                      ]
                    },
                    styles: {}
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];
