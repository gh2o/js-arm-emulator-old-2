#!/bin/sh
arm-none-eabi-objcopy vmlinux physical --change-addresses=-0xbf000000
