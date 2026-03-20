interface TextInputProps {
  id: string
  label: string
  type?: 'text' | 'password'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  icon?: string
  'data-testid'?: string
}

export function TextInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  icon = 'person',
  'data-testid': dataTestId,
}: TextInputProps) {
  return (
    <div className="group">
      <label
        htmlFor={id}
        className="block font-label text-on-surface-variant text-[0.7rem] uppercase tracking-widest mb-3 ml-1"
      >
        {label}
      </label>
      <div className="relative flex items-center bg-surface-container-low rounded-xl transition-all duration-400 focus-within:bg-surface-container-high border border-transparent focus-within:border-primary/20">
        <span className="material-symbols-outlined absolute left-5 text-on-surface-variant group-focus-within:text-primary transition-colors duration-400">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          data-testid={dataTestId}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-transparent border-none py-5 pl-14 pr-6 focus:ring-0 text-on-surface placeholder:text-outline-variant font-body"
        />
      </div>
    </div>
  )
}
