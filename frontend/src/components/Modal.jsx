const Modal = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface p-6 rounded-3xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        <h3 className="text-xl font-semibold text-text-primary mb-4">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
};

export default Modal;
