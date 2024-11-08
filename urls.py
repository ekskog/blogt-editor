import os
import re

def modify_files_in_directory(directory_path):
    # Define a regex pattern to match the structure [ @ [[<url>](<text>) ] ]
    pattern = re.compile(r'\[\s*@\s*\[\[(.*?)\]\((.*?)\)\s*\]\s*\]')

    # Traverse all subdirectories and files
    for root, dirs, files in os.walk(directory_path):
        for filename in files:
            # Skip if not a .md file
            if not filename.endswith(".md"):
                continue

            file_path = os.path.join(root, filename)
            print(f"Processing file: {file_path}")
            
            with open(file_path, 'r') as file:
                lines = file.readlines()

            # Initialize a flag to check if modifications were made
            modified = False
            
            # Create a new list to store modified lines
            new_lines = []
            
            # Loop through each line to apply modifications
            for i, line in enumerate(lines):
                # Debug print the current line
                print(f"Line {i+1}: {line.strip()}")

                # Find the pattern [ @ [[<url>](<text>) ] ] and swap the URL and text
                modified_line = pattern.sub(r'[[\2](\1)]', line)

                # If the line was changed, note the modification
                if modified_line != line:
                    print(f"Modified line {i+1} to: {modified_line.strip()}")
                    modified = True
                    line = modified_line

                # Append the current (modified or original) line
                new_lines.append(line)

            # If modifications were made, rewrite the file with the new lines
            if modified:
                with open(file_path, 'w') as file:
                    file.writelines(new_lines)
                print(f"Modified file: {filename}")
            else:
                print(f"No modifications needed for file: {filename}")

# Directory path containing your files
directory_path = "/Users/lucarv/Documents/repos/Blot/blot-too/posts"
print("Start")
modify_files_in_directory(directory_path)
