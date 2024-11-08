import os
import re

def modify_files_in_directory(directory_path):
    # Define a regex pattern to match the structure [[<text>](<url>)]
    pattern = re.compile(r'\[\[(.*?)\]\((.*?)\)\]')

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

                # Check if the line matches the pattern [[text](url)]
                if pattern.search(line):
                    new_lines.append(line)
                    
                    # If the next line is not empty, add an empty line after the current line
                    if i + 1 < len(lines) and lines[i + 1].strip() != "":
                        print(f"Adding empty line after line {i+1}")
                        new_lines.append("\n")
                    modified = True
                elif line.strip() == "":  # If the line is empty, replace it with "  "
                    print(f"Replacing empty line with two blank spaces")
                    new_lines.append("  \n")
                    modified = True
                else:
                    # Just append the line as is if no modification needed
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
