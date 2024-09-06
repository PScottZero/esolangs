import { ChangeEvent } from "react";

export async function readTextFileFromServer(
  url: string,
  onload: (result: string) => void,
) {
  const blob = await readBlobFromServer(url);
  readTextFile(blob, onload);
}

export async function readTextFileFromLocal(
  e: ChangeEvent<HTMLInputElement>,
  onload: (result: string) => void,
) {
  readTextFile(e.target.files![0], onload);
}

export function readTextFile(blob: Blob, onload: (result: string) => void) {
  const reader = new FileReader();
  reader.onload = async () => onload(reader.result as string);
  reader.readAsText(blob);
}

export async function readImageFromServer(
  url: string,
): Promise<HTMLImageElement> {
  const blob = await readBlobFromServer(url);
  const objUrl = URL.createObjectURL(blob);
  const img = new Image();
  img.src = objUrl;
  return img;
}

export async function readBlobFromServer(url: string): Promise<Blob> {
  const res = await fetch(url);
  return res.blob();
}

export function saveTextFile(name: string, text: string) {
  const saveEl = document.createElement("a");
  saveEl.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  saveEl.download = name;
  saveEl.click();
  saveEl.remove();
}
