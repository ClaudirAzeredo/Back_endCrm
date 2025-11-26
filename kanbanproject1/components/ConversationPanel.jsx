"use client"

import { useState } from "react"

// Dados de exemplo
const contacts = [
  {
    id: "c1",
    name: "João Silva",
    avatar: "/placeholder.svg?height=40&width=40",
    project: "Implementação ERP",
    lastMessage: "Quando podemos agendar o treinamento?",
    time: "10:30",
    unread: 2,
    online: true,
    isWhatsapp: true,
  },
  {
    id: "c2",
    name: "Maria Oliveira",
    avatar: "/placeholder.svg?height=40&width=40",
    project: "Migração de Dados",
    lastMessage: "Os dados foram migrados com sucesso",
    time: "09:15",
    unread: 0,
    online: false,
    isWhatsapp: true,
  },
  {
    id: "c3",
    name: "Pedro Santos",
    avatar: "/placeholder.svg?height=40&width=40",
    project: "Treinamento",
    lastMessage: "Precisamos remarcar para amanhã",
    time: "Ontem",
    unread: 1,
    online: true,
    isWhatsapp: false,
  },
]

const conversations = {
  c1: [
    {
      id: "m1",
      sender: "João Silva",
      content: "Olá, gostaria de saber quando podemos agendar o treinamento para a equipe.",
      time: "10:15",
      isMe: false,
    },
    {
      id: "m2",
      sender: "Você",
      content: "Olá João! Podemos agendar para a próxima semana. Quais dias seriam melhores para vocês?",
      time: "10:20",
      isMe: true,
    },
    {
      id: "m3",
      sender: "João Silva",
      content: "Terça ou quinta-feira seria ideal para nós.",
      time: "10:25",
      isMe: false,
    },
    {
      id: "m4",
      sender: "João Silva",
      content: "Quando podemos agendar o treinamento?",
      time: "10:30",
      isMe: false,
    },
  ],
  c2: [
    {
      id: "m1",
      sender: "Maria Oliveira",
      content: "Bom dia! Estamos com uma dúvida sobre a migração dos dados financeiros.",
      time: "09:00",
      isMe: false,
    },
    {
      id: "m2",
      sender: "Você",
      content: "Bom dia Maria! Qual é a dúvida específica?",
      time: "09:05",
      isMe: true,
    },
    {
      id: "m3",
      sender: "Maria Oliveira",
      content: "Os dados foram migrados com sucesso",
      time: "09:15",
      isMe: false,
    },
  ],
}

function ConversationPanel() {
  const [activeContact, setActiveContact] = useState(null)
  const [messageInput, setMessageInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Filtrar contatos com base na pesquisa
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.project.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Filtrar por tipo
  const getFilteredContacts = () => {
    if (activeTab === "whatsapp") {
      return filteredContacts.filter((contact) => contact.isWhatsapp)
    }
    if (activeTab === "internal") {
      return filteredContacts.filter((contact) => !contact.isWhatsapp)
    }
    return filteredContacts
  }

  // Enviar mensagem
  const sendMessage = (e) => {
    e.preventDefault()
    if (!messageInput.trim() || !activeContact) return

    // Aqui você implementaria a lógica real de envio de mensagem
    setMessageInput("")
  }

  return (
    <div className="conversation-panel">
      {/* Painel de contatos */}
      <div className="contacts-sidebar">
        <div className="contacts-header">
          <div className="contacts-search">
            <span className="contacts-search-icon">🔍</span>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="contacts-tabs">
          <div className="contacts-tabs-list">
            <button
              className={`contacts-tabs-trigger ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              Todos
            </button>
            <button
              className={`contacts-tabs-trigger ${activeTab === "whatsapp" ? "active" : ""}`}
              onClick={() => setActiveTab("whatsapp")}
            >
              📱 WhatsApp
            </button>
            <button
              className={`contacts-tabs-trigger ${activeTab === "internal" ? "active" : ""}`}
              onClick={() => setActiveTab("internal")}
            >
              Interno
            </button>
          </div>
        </div>

        <div className="contacts-list">
          {getFilteredContacts().map((contact) => (
            <ContactItem
              key={contact.id}
              contact={contact}
              isActive={activeContact?.id === contact.id}
              onClick={() => setActiveContact(contact)}
            />
          ))}
        </div>

        <div className="contacts-footer">
          <button className="new-conversation-btn">➕ Nova Conversa</button>
        </div>
      </div>

      {/* Painel de conversação */}
      {activeContact ? (
        <div className="conversation-main">
          <div className="conversation-header">
            <div className="conversation-contact-info">
              <div className="conversation-avatar">
                <img src={activeContact.avatar || "/placeholder.svg"} alt={activeContact.name} />
              </div>
              <div className="conversation-details">
                <h3>{activeContact.name}</h3>
                <div className="conversation-status">
                  <span className="conversation-project-badge">{activeContact.project}</span>
                  <span className={`conversation-online-status ${activeContact.online ? "online" : "offline"}`}>
                    <span className={`conversation-online-dot ${activeContact.online ? "online" : ""}`}></span>
                    {activeContact.online ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>
            <div className="conversation-actions">
              <button className="conversation-action-btn">📞</button>
              <button className="conversation-action-btn">📹</button>
              <button className="conversation-action-btn">⋮</button>
            </div>
          </div>

          <div className="conversation-messages">
            <div className="messages-container">
              {conversations[activeContact.id]?.map((message) => (
                <div key={message.id} className={`message ${message.isMe ? "sent" : "received"}`}>
                  <div className={`message-bubble ${message.isMe ? "sent" : "received"}`}>
                    <div className="message-content">{message.content}</div>
                    <div className={`message-time ${message.isMe ? "sent" : "received"}`}>{message.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="conversation-input">
            <form onSubmit={sendMessage} className="conversation-input-form">
              <button type="button" className="conversation-input-attachment">
                📎
              </button>
              <input
                type="text"
                className="conversation-input-field form-input"
                placeholder="Digite sua mensagem..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
              />
              <button type="submit" className="conversation-input-send">
                ➤
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="conversation-empty">
          <h3>Selecione uma conversa</h3>
          <p>Escolha um contato para iniciar ou continuar uma conversa</p>
        </div>
      )}
    </div>
  )
}

// Componente de item de contato
function ContactItem({ contact, isActive, onClick }) {
  return (
    <div className={`contact-item ${isActive ? "active" : ""}`} onClick={onClick}>
      <div className="contact-item-content">
        <div className="contact-avatar-container">
          <div className="contact-avatar">
            <img src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
          </div>
          {contact.online && <span className="contact-online-indicator"></span>}
        </div>
        <div className="contact-info">
          <div className="contact-header">
            <h4 className="contact-name">{contact.name}</h4>
            <span className="contact-time">{contact.time}</span>
          </div>
          <div className="contact-message-row">
            <p className="contact-last-message">{contact.lastMessage}</p>
            {contact.unread > 0 && <span className="contact-unread-badge">{contact.unread}</span>}
          </div>
          <div className="contact-meta">
            <span className="contact-project-badge">{contact.project}</span>
            {contact.isWhatsapp && <span className="contact-whatsapp-icon">📱</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConversationPanel
