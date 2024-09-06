import Image from "next/image";

import Window from "../window/window";
import styles from "./programs.module.scss";

type ProgramsProps = {
  programs: string[];
  onClick: (program: string) => void;
  programIcon?: string;
  windowIcon?: string;
};

function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? `${str.substring(0, maxLength - 3)}...` : str;
}

export default function Programs({
  programs,
  onClick,
  programIcon,
  windowIcon,
}: ProgramsProps) {
  const programEls = [];
  for (const program of programs) {
    programEls.push(
      <div
        key={program}
        className={styles.program}
        onClick={() => onClick(program)}
      >
        <Image
          src={`/esolangs/icons/${programIcon ?? "program.png"}`}
          alt="program"
          width={32}
          height={32}
        />
        <p>{truncate(program, 16)}</p>
      </div>,
    );
  }

  return (
    <Window title="Programs" icon={windowIcon ?? "folder.png"}>
      <div className={styles.programs}>{programEls}</div>
    </Window>
  );
}
