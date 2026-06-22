import re

# Read index.js
with open('index.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# Read index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Find all getElementById in JS
get_element_ids = re.findall(r'document\.getElementById\([\'"]([a-zA-Z0-9_-]+)[\'"]\)', js_content)
get_element_ids = list(set(get_element_ids))

# Find all ids defined in HTML
html_ids = re.findall(r'id=[\'"]([a-zA-Z0-9_-]+)[\'"]', html_content)
html_ids = set(html_ids)

print(f"Total unique IDs queried in JS: {len(get_element_ids)}")
print(f"Total unique IDs defined in HTML: {len(html_ids)}")

missing_ids = []
for js_id in get_element_ids:
    if js_id not in html_ids:
        missing_ids.append(js_id)

if missing_ids:
    print("\nWARNING: The following IDs are queried in JS but MISSING in HTML:")
    for mid in missing_ids:
        # check if it is queried with optional chaining in JS
        pattern = rf'document\.getElementById\([\'"]{mid}[\'"]\)\?'
        is_optional = re.search(pattern, js_content) is not None
        print(f" - {mid} (optional chaining used: {is_optional})")
else:
    print("\nSUCCESS: All IDs queried in JS exist in HTML!")
