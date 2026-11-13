"""Retired #49 celestial study workflow. Historical source remains in Git history.

This entry point never creates or deletes a Next.js route. Current controls
are checked on the real homepage and project page, without a study fixture.
"""
import argparse

parser = argparse.ArgumentParser(description=__doc__)
parser.parse_known_args()
parser.exit(2, "celestial-preview.py is retired; no files were changed. "
            "Use scripts/projects-preview.py for current theme controls, "
            "or scripts/home-scene-preview.py --help for homepage checks. "
            "See docs/project/home-mode-panels.md.\n")
