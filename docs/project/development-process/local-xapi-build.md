# Local XAPI build

How to build [XAPI](https://github.com/xcp-ng/xen-api) locally.

Here are the steps:
- First, set up a build env:
    - Install the following packages: `dlm-devel` `gmp` `gmp-devel` `libffi-devel` `openssl-devel` `pciutils-devel` `systemd-devel` `xen-devel` `xxhash-devel`.
    - Install [`opam`](https://opam.ocaml.org/doc/Install.html) to set up a build env.
    - Run `opam init`.
    - Run `opam switch create toolstack 4.08.1`, this sets up an opam `switch` which is a virtual ocaml env.
    - Run `opam repo add xs-opam https://github.com/xapi-project/xs-opam.git`, this adds the [`xs-opam` repo](https://github.com/xapi-project/xs-opam.git) to your env.
    - Run `opam repo remove default`, this removes the the default repo from your env as we only want the `xs-opam` one.
    - Run `opam depext -vv -y xs-toolstack`, this installs the dependency needed to build `xs-toolstack`
    - Run `opam install xs-toolstack -y`, this installs the toolstack to build the xapi in your env.

- Build the XAPI:
    - Go to the dir where your `xen-api` code base is.
    - Run `opam install . --deps-only -t`, this installs the dependencies the build needs.
    - Run `./configure`
    - Now you can run `make`, `make install` or `make test`