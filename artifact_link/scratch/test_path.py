import os
import sys

artifactDir = 'C:\\Users\\prem\\.gemini\\antigravity\\brain\\b5c3f625-094a-4aca-91c7-475cf538a7eb'

testPaths = [
    '/C:/Users/prem/.gemini/antigravity/brain/b5c3f625-094a-4aca-91c7-475cf538a7eb/screenshot.png',
    '/C:\\Users\\prem\\.gemini\\antigravity\\brain\\b5c3f625-094a-4aca-91c7-475cf538a7eb\\screenshot.png',
    '/Users/prem/.gemini/antigravity/brain/b5c3f625-094a-4aca-91c7-475cf538a7eb/screenshot.png',
    '/screenshot.png',
    '//localhost/C$/Users/prem/.gemini/antigravity/brain/b5c3f625-094a-4aca-91c7-475cf538a7eb/screenshot.png',
    '\\\\localhost\\C$\\Users\\prem\\.gemini\\antigravity\\brain\\b5c3f625-094a-4aca-91c7-475cf538a7eb\\screenshot.png',
]

print("Python version:", sys.version)
print("CWD:", os.getcwd())

for p in testPaths:
    absPath = os.path.abspath(p)
    isWithin = absPath.lower().startswith(artifactDir.lower())
    print(f"Path: {p}")
    print(f"  Abspath:  {absPath}")
    print(f"  IsWithin: {isWithin}")
