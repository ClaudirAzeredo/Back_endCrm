"use client"

function Modal({ title, children, onClose, size = "md" }) {
  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "max-w-md"
      case "lg":
        return "max-w-4xl"
      case "xl":
        return "max-w-6xl"
      default:
        return "max-w-2xl"
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal-container ${getSizeClass()}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export default Modal
