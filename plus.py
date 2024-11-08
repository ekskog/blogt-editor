import os
import re

def modify_files_in_directory(directory_path):
    # Define a regex pattern to match ']' followed by '+'
    pattern = re.compile(r'\](?=\+)')
    
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
            for line in lines:
                # Replace ']+' with '] +' (i.e., adds a space after ']')
                new_line = pattern.sub('] +', line)
                
                # If there was a change, mark it as modified
                if new_line != line:
                    modified = True
                
                new_lines.append(new_line)

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
