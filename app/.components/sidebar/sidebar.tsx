"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import Button from "../button/button";
import styles from "./sidebar.module.scss";

const ESOLANGS = ["Brainfuck", "Piet"];

export default function Sidebar() {
  const router = useRouter();

  const esolangs = [];
  for (const esolang of ESOLANGS) {
    const id = esolang.toLowerCase();
    esolangs.push(
      <Button key={id} width="100%" onClick={() => router.push(`/${id}`)}>
        <div className={styles.esolang}>
          <Image
            src={`/esolangs/icons/${id}.png`}
            alt={esolang}
            width={128}
            height={96}
          />
          <p>{esolang}</p>
        </div>
      </Button>,
    );
  }

  return <div className={styles.sidebar}>{esolangs}</div>;
}
