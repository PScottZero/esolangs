import type { Metadata } from "next";
import styles from "./layout.module.scss";
import "./globals.scss";
import Sidebar from "./components/sidebar/sidebar";

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
      <body>
        <Sidebar></Sidebar>
        <div className={styles.content}>{children}</div>
      </body>
    </html>
  );
}
