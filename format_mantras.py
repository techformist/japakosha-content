#!/usr/bin/env python3
"""
Script to format Sanskrit/Kannada mantra files according to standard conventions:
1. Remove comment markers: -|| ... ||- → || ... ||
2. Fix verse numbers: || ೧ | → || ೧ ||, | ೧ || → || ೧ ||
3. Add blank line after verse endings (||)
4. Indent padas after single | for readability
"""

import os
import re
import glob


def format_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.split("\n")
    formatted_lines = []
    in_yaml = False

    for i, line in enumerate(lines):
        # Track YAML front matter
        if line.strip() == "---":
            if not in_yaml:
                in_yaml = True
            else:
                in_yaml = False
            formatted_lines.append(line)
            continue

        # Keep YAML content as-is
        if in_yaml:
            formatted_lines.append(line)
            continue

        # Fix comment markers: -|| ... ||- → || ... ||
        line = re.sub(r"^-\|\|\s*", "|| ", line)
        line = re.sub(r"\s*\|\|-$", " ||", line)

        # Fix verse numbers with trailing |: || ೧ | → || ೧ ||
        line = re.sub(r"\|\|\s*([೦-೯೦-೯\d]+)\s*\|\s*$", r"|| \1 ||", line)

        # Fix verse numbers with leading single |: | ೧ || → || ೧ ||
        line = re.sub(r"(?<!\|)\|\s*([೦-೯೦-೯\d]+)\s*\|\|", r"|| \1 ||", line)

        # For lines with single | (pada separator), add indentation
        stripped = line.rstrip()
        if (
            " | " in line
            and not stripped.endswith("||")
            and not stripped.startswith("||")
        ):
            parts = line.split(" | ", 1)
            if (
                len(parts) == 2
                and parts[1].strip()
                and not parts[1].strip().startswith("||")
            ):
                line = parts[0] + " |\n    " + parts[1]

        formatted_lines.append(line)

    # Add blank lines after verses ending with ||
    result_lines = []
    for i, line in enumerate(formatted_lines):
        result_lines.append(line)

        stripped = line.rstrip()
        if stripped.endswith("||") and stripped:
            if i + 1 < len(formatted_lines):
                next_line = formatted_lines[i + 1]
                if next_line.strip():
                    result_lines.append("")

    return "\n".join(result_lines)


def main():
    content_dir = os.path.join(os.path.dirname(__file__), "content", "kn")
    files = glob.glob(os.path.join(content_dir, "*.kn.md"))

    print(f"Found {len(files)} files to process")

    for filepath in files:
        try:
            formatted = format_file(filepath)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(formatted)
            print(f"✓ Formatted: {os.path.basename(filepath)}")
        except Exception as e:
            print(f"✗ Error processing {filepath}: {e}")

    print(f"\nCompleted formatting {len(files)} files")


if __name__ == "__main__":
    main()
