import os

folder = "brainfuck"
root_path = f"public/bin/{folder}"

print("[")
for file in sorted(os.listdir(root_path)):
    print(f"'{file}',")
print("];")
