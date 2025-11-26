function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">Sistema Kanban CRM</h1>
        <div className="header-actions">
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">
              Usuário: <span className="font-medium">Admin</span>
            </div>
            <button className="btn btn-outline btn-sm">Sair</button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
