import re

def check_file(path):
    print(f"=== Checking {path} ===")
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    current_dict = None
    seen = {}
    for i, line in enumerate(lines, 1):
        if 'Record<string, string>' in line or 'Dict[str, str]' in line:
            name = line.split(':')[0].strip().split(' ')[-1]
            current_dict = name
            seen[current_dict] = {}
        if current_dict:
            matches = re.findall(r"['\"]([^'\"]+)['\"]\s*:", line)
            for k in matches:
                if k in seen[current_dict]:
                    print(f"  {current_dict} line {i}: duplicate key {ascii(k)} (first line {seen[current_dict][k]})")
                else:
                    seen[current_dict][k] = i
        if line.strip() == '};' or line.strip() == '}':
            current_dict = None

check_file('frontend/src/services/auxiliaryPhonetics.ts')
check_file('backend/languages/phonetics.py')
