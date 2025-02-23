# Wiser Matter Bridge

## Table of Contents
- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Additional Commands](#additional-commands)
- [Data Storage](#data-storage)
- [License](#license)

## Introduction
The Wiser Matter Bridge is a project designed to bridge multiple lights and blinds using the Matter protocol.

## Prerequisites
Before you begin, ensure you have met the following requirements:
- Node.js and npm installed
- Git installed
- Internet access to download dependencies

## Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/rolfscherer/wiser-matter-bridge.git
   cd wiser-matter-bridge


Install and update all dependencies:

`npm install`

Build the bridge

`npm run build`

## Configuration

Update the config.yaml file with your specific settings, such as IP addresses and 
authentication tokens.
Copy the config.yaml file to the build directory.

## Running the Application

To run the application, use the following command:
`cd build/bundle`
`node wmb.cjs`


# Data

Windows: %APPDATA%/matter

Linux: ~/.matter

