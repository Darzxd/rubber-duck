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
        className="text-sm font-medium text-neutral-700"
      >
        Your name
      </label>
      <input
        id="participant-name"
        name="participant-name"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        autoComplete="off"
        autoFocus
        maxLength={40}
        placeholder="How the team will see you"
        suppressHydrationWarning
        className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 disabled:cursor-not-allowed disabled:bg-neutral-100"
      />
    </div>
  );
}
