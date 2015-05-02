# Project goals

# Instalation

## OSX Instalation

Install [homebrew](http://brew.sh/)

Install [NodeJS](https://nodejs.org/)

*or*

Nodejs via homebrew

    brew install nodejs

Install opencv via homebrew

    brew update
    brew tap homebrew/science
    brew install opencv

Follow directions in homebrew for installing the newly installed python packages.

As of this writing brew asks you to run these commands after installing. ( sub in your username )

    mkdir -p /Users/<your username>/.local/lib/python2.7/site-packages
    echo 'import site; site.addsitedir("/usr/local/lib/python2.7/site-packages")' >> /Users/<your username>/.local/lib/python2.7/site-packages/homebrew.pth

# Running the code

TODO!

# TODO:

High Priority
- [ ] Open CV drone command loop for drone feedback and control
- [ ] Process exitor event watchign function that lands drone on code failure or exit
- [ ] Use opencv to detect a line on the floor and follow it
- [ ] Use opencv to detect a seperate marker that signifies an oil spill
- [ ] When detecting an oil spill warn the operator

Low priority
- [ ] Stop the drone from moving forward if it detects a face
- [ ] Make the drone dance when if finds an oil spill
