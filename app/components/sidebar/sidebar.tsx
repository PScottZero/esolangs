"use client";

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReactElement } from "react";
import Image from "next/image";
import styles from "./sidebar.module.scss";
import { useRouter } from "next/navigation";

function esolang(
  id: string,
  label: string,
  router: AppRouterInstance
): ReactElement {
  return (
    <div className={styles.outerEsolang} onClick={() => router.push(`/${id}`)}>
      <div className={styles.innerEsolang}>
        <div>
          <Image
            src={`/esolangs/icons/${id}.png`}
            alt={id}
            width={128}
            height={96}
          />
          <p>{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const router = useRouter();
  return (
    <div className={styles.sidebar}>
      {esolang("brainfuck", "Brainfuck", router)}
      {esolang("piet", "Piet", router)}
    </div>
  );
}
