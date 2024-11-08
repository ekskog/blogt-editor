import os
import re
# Define the root directory from which to start the recursive search
root_directory = '/Users/lucarv/Documents/repos/Blot/blot-too/posts'
# Regular expression patterns to match metadata and image tags
date_pattern = re.compile(r'^Date: ')
permalink_pattern = re.compile(r'^Permalink: ')
def process_file(filepath):
    try:
        # Print the file being processed
        print(f"Processing file: {filepath}")
        # Read the file contents, ignoring any decode errors
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
            lines = file.readlines()
        # Check and remove the first two lines if they contain the metadata
        if len(lines) > 1 and date_pattern.match(lines[0]) and permalink_pattern.match(lines[1]):
            lines = lines[2:]
        # Process each line
        new_lines = []
        previous_line_was_tags = False
        for line in lines:
            # Remove empty lines
            if not line.strip():
                continue
            # Detect "Tags:" line to remove extra line after it
            elif line.startswith('Tags:'):
                new_lines.append(line)
                previous_line_was_tags = True
            elif img_tag_pattern.search(line):
                continue
            else:
                new_lines.append(line)
                previous_line_was_tags = False
        # Write the modified content back to the file if changes were made
        new_content = ''.join(new_lines)
        with open(filepath, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f"Updated file: {filepath}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
# Walk through all files and subdirectories from the root directory
for dirpath, _, filenames in os.walk(root_directory):
    for filename in filenames:
        filepath = os.path.join(dirpath, filename)
        if os.path.isfile(filepath):
            process_file(filepath)
print("Processing complete.")
