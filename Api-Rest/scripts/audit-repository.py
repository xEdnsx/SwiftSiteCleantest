"""Audit prospective monorepo files without staging them or printing secrets.

Run from any directory with Python 3: python Api-Rest/scripts/audit-repository.py
Uses Git's actual ignore rules. This heuristic is not a substitute for human review.
"""
import json
import re
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[2]
result = subprocess.run(
    ['git', '-C', str(root), 'ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    check=True, capture_output=True,
)
paths = sorted(set(p.decode('utf-8') for p in result.stdout.split(b'\0') if p))
patterns = {
    'private_key': re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----'),
    'github_token': re.compile(r'\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b'),
    'aws_access_key': re.compile(r'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b'),
    'laravel_key': re.compile(r'(?m)^APP_KEY\s*=\s*["\']?base64:[A-Za-z0-9+/=]{30,}'),
    'provider_api_key': re.compile(r'\bsk-(?:proj-)?[A-Za-z0-9_-]{35,}\b'),
    'jwt_literal': re.compile(r'\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b'),
    'credential_url': re.compile(r'(?:mysql|postgres(?:ql)?|https?)://[^\s/:]+:[^\s/@]+@'),
}
issues = []
sizes = []
for relative in paths:
    path = root / relative
    if not path.is_file():
        continue
    sizes.append((path.stat().st_size, relative))
    name = path.name
    if name.startswith('.env') and name != '.env.example' and not name.endswith('.example'):
        issues.append({'file': relative, 'type': 'private_environment_file'})
    if path.suffix.lower() in {'.sql', '.sqlite', '.sqlite3', '.db', '.pem', '.key', '.p12', '.pfx', '.jks', '.keystore'}:
        issues.append({'file': relative, 'type': 'private_data_or_key_file'})
    raw = path.read_bytes()
    if raw.startswith(b'SQLite format 3\0'):
        issues.append({'file': relative, 'type': 'sqlite_database_including_extensionless'})
    if b'\0' in raw[:8192]:
        continue
    try:
        text = raw.decode('utf-8-sig')
    except UnicodeDecodeError:
        continue
    for kind, pattern in patterns.items():
        for match in pattern.finditer(text):
            issues.append({'file': relative, 'line': text.count('\n', 0, match.start()) + 1, 'type': kind})
    # Literal credentials in env-format files. References and explicit examples are safe.
    if name.startswith('.env'):
        for index, line in enumerate(text.splitlines(), 1):
            match = re.match(r'(?:DB_PASSWORD|MAIL_PASSWORD|AWS_SECRET_ACCESS_KEY|SLACK_BOT_USER_OAUTH_TOKEN)\s*=\s*(.*)', line)
            if match:
                value = match.group(1).strip().strip('"\'')
                if value and value not in {'null', 'CHANGE_ME', 'YOUR_PASSWORD'} and not value.startswith('${'):
                    issues.append({'file': relative, 'line': index, 'type': 'nonempty_example_credential'})

largest = [{'file': path, 'bytes': size} for size, path in sorted(sizes, reverse=True)[:10]]
report = {
    'candidate_files': len(paths),
    'candidate_bytes': sum(size for size, _ in sizes),
    'high_confidence_findings': issues,
    'files_over_50_MiB': [p for size, p in sizes if size > 50 * 1024 * 1024],
    'largest_files': largest,
    'note': 'No secret values are printed. Manual review remains necessary.',
}
print(json.dumps(report, ensure_ascii=False, indent=2))
raise SystemExit(1 if issues else 0)
