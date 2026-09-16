import Typewriter from "@/shared/ui/Typewriter";

interface TypedContactValueProps {
  text: string;
  visible: boolean;
  cycle: number;
  delay?: number;
  animate?: boolean;
}

export function TypedContactValue({
  text,
  visible,
  cycle,
  delay = 0,
  animate = true,
}: TypedContactValueProps) {
  return (
    <>
      <span className="sr-only">{text}</span>
      {visible && animate ? (
        <Typewriter
          key={`${cycle}-${text}`}
          as="span"
          text={text}
          speed={22}
          initialDelay={delay}
          loop={false}
          showCursor={false}
          aria-hidden="true"
        />
      ) : visible ? (
        <span aria-hidden="true">{text}</span>
      ) : (
        <span className="contact-type-placeholder" aria-hidden="true">
          {text}
        </span>
      )}
    </>
  );
}
