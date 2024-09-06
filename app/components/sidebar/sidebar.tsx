"use client";

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ReactElement } from "react";

import styles from "./sidebar.module.scss";

function esolang(
  router: AppRouterInstance,
  label: string,
  id?: string,
): ReactElement {
  id = id ?? label.toLowerCase();
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
      {esolang(router, "Brainfuck")}
      {esolang(router, "Piet")}
    </div>
  );
}
