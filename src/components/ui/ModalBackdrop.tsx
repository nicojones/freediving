interface ModalBackdropProps {
  children: React.ReactNode;
}

export const ModalBackdrop = ({ children }: ModalBackdropProps) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 backdrop-blur-lg">
      {children}
    </div>
  );
};
