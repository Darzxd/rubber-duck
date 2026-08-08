type NameFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function NameField({
  value,
  onChange,
  disabled = false,
}: NameFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="participant-name"
        className="text-sm font-semibold text-neutral-700"
      >
        Tu nombre
      </label>
      <input
        id="participant-name"
        name="participant-name"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        autoComplete="off"
        maxLength={40}
        placeholder="Cómo te va a ver el equipo"
        className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none disabled:cursor-not-allowed disabled:bg-neutral-100"
      />
    </div>
  );
}
