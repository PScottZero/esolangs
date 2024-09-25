import os
import json


root_path = f"public/bin"
root_url = "/esolangs/bin"
folders = ["brainfuck", "piet"]

defaults = {
    "brainfuck": "sierpinski.b",
    "piet": "hw1-1.gif",
}

programs_json = {}

for folder in folders:
  folder_path = f"{root_path}/{folder}"
  url_path = f"{root_url}/{folder}"
  programs_json[folder] = {}
  programs_json[folder]["path"] = url_path
  programs_json[folder]["default"] = f"{url_path}/{defaults[folder]}"
  programs_json[folder]["programs"] = [
      file for file in sorted(os.listdir(folder_path), key=lambda x: x.lower())
      if file != ".DS_Store"
  ]

json.dump(programs_json, open("public/programs.json", "w"), indent=2)
