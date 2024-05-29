from _utilities import *

def install_frontend_dependencies():
    """
    Install frontend JavaScript dependencies using npm.
    """
    os.chdir(os.path.join(os.getcwd(), FRONTEND_DIR))

    print("Installing frontend dependencies using npm...")
    run_command('npm install')
    
    os.chdir("..")

def install_backend_dependencies():
    """
    Set up a Python virtual environment and install backend dependencies.
    """
    os.chdir(os.path.join(os.getcwd(), BACKEND_DIR))

    if not os.path.exists('venv'):
        print("Setting up Python virtual environment...")
        run_command('python3 -m venv venv')

    print("Activating the virtual environment and installing backend dependencies...")
    if sys.platform == "win32":
        # Windows requires a different command to activate the virtual environment
        run_command('.\\venv\\Scripts\\activate && pip install -r requirements.txt')
    else:
        # Linux and macOS use this command
        run_command('. venv/bin/activate && pip install -r requirements.txt')

    os.chdir("..")

def main():
    install_frontend_dependencies()
    install_backend_dependencies()

if __name__ == "__main__":
    main()