import type { Metadata } from "next";

import Sidebar from "./components/sidebar/sidebar";
import "./globals.scss";
import styles from "./layout.module.scss";

export const metadata: Metadata = {
  title: "Esolangs",
  description: "Collection of esoteric programming language interpreters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/esolangs/icons/brainfuck.png" />
      </head>
      <body>
        <Sidebar></Sidebar>
        <div className={styles.content}>{children}</div>
      </body>
    </html>
  );
}
