import os
import re

def process_file(file_path, log_file):
    # Read the file content
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    # Find words with 'z' followed by a non-vowel or non-'z' character
    matches = re.finditer(r'\b\w*z([^aeiouAEIOUzZ])\w*\b', content)

    # Process each match and apply changes
    modified = False
    changes = []  # To store changes for logging

    for match in matches:
        original_word = match.group(0)  # The whole word containing 'z'
        updated_word = re.sub(r'z([^aeiouAEIOUzZ])', r'z \1', original_word)

        # Only update if there's an actual change
        if original_word != updated_word:
            content = content[:match.start()] + updated_word + content[match.end():]
            changes.append((original_word, updated_word))
            modified = True

    # Write changes back to the file if any modifications were made
    if modified:
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(content)
        
        # Log each change
        with open(log_file, 'a', encoding='utf-8') as log:
            for original, updated in changes:
                log.write(f"File: {file_path} | Original: '{original}' | Updated: '{updated}'\n")
        print(f"Changes applied to {file_path}")

def process_directory(directory_path):
    log_file = "change_log.txt"
    
    # Clear the log file at the start
    with open(log_file, 'w', encoding='utf-8') as log:
        log.write("Change Log\n")
        log.write("="*50 + "\n\n")

    # Iterate over all files in the directory
    for root, dirs, files in os.walk(directory_path):
        for file in files:
            file_path = os.path.join(root, file)
            process_file(file_path, log_file)

# Directory containing your text files
directory_path = '/Users/lucarv/Documents/repos/Blot/blot-too/posts/2020'
process_directory(directory_path)
