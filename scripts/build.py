"""Export only public website files. No dependencies or frontend compilation."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'dist'
PUBLIC_FILES = ('index.html', 'privacy.html', '404.html', 'robots.txt',
                'favicon.ico', 'site.webmanifest')


def build():
    OUTPUT.mkdir(exist_ok=True)
    for name in PUBLIC_FILES:
        shutil.copy2(ROOT / name, OUTPUT / name)
    asset_output = OUTPUT / 'assets'
    if asset_output.exists():
        shutil.rmtree(asset_output)
    shutil.copytree(ROOT / 'assets', asset_output,
                    ignore=shutil.ignore_patterns('README.md', '.gitkeep', '.DS_Store'))
    return OUTPUT


if __name__ == '__main__':
    destination = build()
    print(f'Website exported to {destination}')
    print('Reference archives, documentation, and scripts are excluded.')
