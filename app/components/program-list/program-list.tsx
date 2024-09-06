import Image from "next/image";

import Window from "../window/window";
import styles from "./program-list.module.scss";

type ProgramListProps = {
  programs: string[];
  onClick: (program: string) => void;
  programIcon?: string;
  windowIcon?: string;
};

export default function ProgramList({
  programs,
  onClick,
  programIcon,
  windowIcon,
}: ProgramListProps) {
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
        <p>{program}</p>
      </div>,
    );
  }

  return (
    <Window title="Programs" icon={windowIcon ?? "folder.png"}>
      <div className={styles.programs}>{programEls}</div>
    </Window>
  );
}
