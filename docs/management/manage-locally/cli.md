# xe CLI

The xe CLI can be used locally on any XCP-ng host, it's installed along with it. However, it's poolwide only. If you want a CLI or an API to control multiple pools at once, we strongly advise to use [Xen Orchestra CLI](../../manage-at-scale/xo-cli).

:::tip
The complete set of all `xe` commands is available in the [Appendix section](../../../appendix/cli_reference).
:::

## ℹ️ Getting help with xe commands

Basic help is available for CLI commands on-host by typing the following:

```
xe help
```

Help for individual commands is available by typing:

```
xe help <command>
```

For example:

```
[ ~]# xe help host-cpu-info
command name            : host-cpu-info
        reqd params     : 
        optional params : uuid
        description     : Lists information about the host's physical CPUs.
```

Or a list of all xe commands is displayed if you type:

```
xe help --all
```

## 🪧 Basic xe syntax

The basic syntax of all XCP-ng xe CLI commands is:

```
xe <command> <argument>=value <argument>=value
```

Each specific command contains its own set of arguments that are of the form `argument=value`. Some commands have required arguments, and most have some set of optional arguments. Typically a command assumes default values for some of the optional arguments when invoked without them.

For example, adding a bootable ISO image as a mounted CD-Rom to a VM can be done with the following command:

```
xe vm-cd-add uuid=679c70cb-b358-00e1-72c0-819e8f74f00c cd-name=ubuntu-20.04.2-live-server-amd64.iso device=1
```

If the xe command is executed remotely, extra arguments are used to connect and authenticate. These arguments also take the form argument=argument_value.

The server argument is used to specify the host name or IP address. The username and password arguments are used to specify credentials.

A password-file argument can be specified instead of the password directly. In this case, the xe command attempts to read the password from the specified file and uses that password to connect. (Any trailing CRs and LFs at the end of the file are stripped off.) This method is more secure than specifying the password directly at the command line.

The optional port argument can be used to specify the agent port on the remote XCP-ng server (defaults to 443).

Example: On the local XCP-ng server:

```
xe vm-list
```

Example: On the remote XCP-ng server:

```
xe vm-list -user username -password password -server hostname
```

Shorthand syntax is also available for remote connection arguments:

* -u user name
* -pw password
* -pwf password file
* -p port
* -s server

Example: On a remote XCP-ng server:

```
xe vm-list -u myuser -pw mypassword -s hostname
```

Arguments are also taken from the environment variable `XE_EXTRA_ARGS`, in the form of comma-separated key/value pairs. For example, to enter commands that are run on a remote XCP-ng server, first run the following command:

```
export XE_EXTRA_ARGS="server=foobar,port=443,username=root,password=pass"
```

After running this command, you no longer have to specify the remote XCP-ng server parameters in each xe command that you run.

Using the `XE_EXTRA_ARGS` environment variable also enables tab completion of xe commands when issued against a remote XCP-ng server, which is disabled by default.

## 🀄 Special characters and syntax

To specify argument/value pairs on the xe command line, write: `argument=value`

Unless the value includes spaces, do not use quotes. There should be no whitespace in between the argument name, the equals sign (=), and the value. Any argument not conforming to this format is ignored.

For values containing spaces, write: `argument="value with spaces"`

When you use the CLI on your XCP-ng server, commands have a tab completion feature similar to the feature in the standard Linux bash shell. For example, if you type `xe vm-l` and then press the `TAB` key, the rest of the command is displayed. If more than one command begins with `vm-l`, pressing `TAB` a second time lists the possibilities. This feature is useful when specifying object UUIDs in commands.

:::tip
Tab completion does not normally work when executing commands on a remote XCP-ng server. However, if you set the `XE_EXTRA_ARGS` variable on the machine where you enter the commands, tab completion is enabled. For more information, see Basic xe syntax.
:::

## 🧮 Command types

The CLI commands can be split in two halves. Low-level commands are concerned with listing and parameter manipulation of API objects. Higher level commands are used to interact with VMs or hosts in a more abstract level.

The low-level commands are:

* class-list

* class-param-get

* class-param-set

* class-param-list

* class-param-add

* class-param-remove

* class-param-clear

Where class is one of:

* bond

* console

* host

* host-crashdump

* host-cpu

* network

* patch

* pbd

* pif

* pool

* sm

* sr

* task

* template

* vbd

* vdi

* vif

* vlan

* vm

Not every value of class has the full set of class-param-action commands. Some values of class have a smaller set of commands.

## 🧶 Parameter types

The objects that are addressed with the xe commands have sets of parameters that identify them and define their states.

Most parameters take a single value. For example, the `name-label` parameter of a VM contains a single string value. In the output from parameter list commands, such as `xe vm-param-list`, a value in parentheses indicates whether parameters are read-write (RW) or read-only (RO). The output of `xe vm-param-list` on a specified VM might have the following lines:

```
user-version ( RW): 1
is-control-domain ( RO): false
```

The first parameter, user-version, is writable and has the value 1. The second, `is-control-domain`, is read-only and has a value of false.

The two other types of parameters are multi-valued. A set parameter contains a list of values. A map parameter is a set of key/value pairs. As an example, look at the following piece of sample output of the `xe vm-param-list` on a specified VM:

```
platform (MRW): acpi: true; apic: true; pae: true; nx: false
allowed-operations (SRO): pause; clean_shutdown; clean_reboot; \
hard_shutdown; hard_reboot; suspend
```

The platform parameter has a list of items that represent key/value pairs. The key names are followed by a colon character (`:`). Each key/value pair is separated from the next by a semicolon character (`;`). The `M` preceding the `RW` indicates that this parameter is a map parameter and is readable and writable. The allowed-operations parameter has a list that makes up a set of items. The `S` preceding the `RO` indicates that this is a set parameter and is readable but not writable.

To filter on a map parameter or set a map parameter, use a colon (`:`) to separate the map parameter name and the key/value pair. For example, to set the value of the `foo` key of the other-config parameter of a VM to `baa`, the command would be

```
xe vm-param-set uuid=VM uuid other-config:foo=baa
```

:::tip
In previous releases, the hyphen character (-) was used to specify map parameters. This syntax still works but is deprecated.
:::

## 🔬 Low-level parameter commands

There are several commands for operating on parameters of objects: class-param-get, class-param-set, class-param-add, class-param-remove, class-param-clear, and class-param-list. Each of these commands takes a uuid parameter to specify the particular object. Since these commands are considered low-level commands, they must use the `UUID` and not the VM name label.

* `class-param-list uuid=uuid`

Lists all of the parameters and their associated values. Unlike the class-list command, this command lists the values of "expensive" fields.

* `class-param-get uuid=uuid param-name=parameter param-key=key`

Returns the value of a particular parameter. For a map parameter, specifying the param-key gets the value associated with that key in the map. If param-key is not specified or if the parameter is a set, the command returns a string representation of the set or map.

* `class-param-set uuid=uuid param=value`

Sets the value of one or more parameters.

* `class-param-add uuid=uuid param-name=parameter key=value param-key=key`

Adds to either a map or a set parameter. For a map parameter, add key/value pairs by using the key=value syntax. If the parameter is a set, add keys with the param-key=key syntax.

* `class-param-remove uuid=uuid param-name=parameter param-key=key`

Removes either a key/value pair from a map, or a key from a set.

* `class-param-clear uuid=uuid param-name=parameter`

Completely clears a set or a map.

## 📜 Low-level list commands

The class-list command lists the objects of type class. By default, this type of command lists all objects, printing a subset of the parameters. This behavior can be modified in the following ways:

* It can filter the objects so that it only outputs a subset
* The parameters that are printed can be modified.

To change the parameters that are printed, specify the argument params as a comma-separated list of the required parameters. For example:

```
xe vm-list params=name-label,other-config
```

Alternatively, to list all of the parameters, use the syntax:

```
xe vm-list params=all
```

The list command doesn’t show some parameters that are expensive to calculate. These parameters are shown as, for example:

```
allowed-VBD-devices (SRO): <expensive field>
```

To obtain these fields, use either the command class-param-list or class-param-get

To filter the list, the CLI matches parameter values with those values specified on the command-line, only printing objects that match all of the specified constraints. For example:

```
xe vm-list HVM-boot-policy="BIOS order" power-state=halted
```

This command lists only those VMs for which both the field power-state has the value halted and the field `HVM-boot-policy` has the value BIOS order.

You can also filter the list by the value of keys in maps or by the existence of values in a set. The syntax for filtering based on keys in maps is `map-name:key=value`. The syntax for filtering based on values existing in a set is `set-name:contains=value`.

When scripting, a useful technique is passing `--minimal` on the command line, causing xe to print only the first field in a comma-separated list. For example, the command `xe vm-list --minimal` on a host with three VMs installed gives the three UUIDs of the VMs:

```
a85d6717-7264-d00e-069b-3b1d19d56ad9,aaa3eec5-9499-bcf3-4c03-af10baea96b7, 42c044de-df69-4b30-89d9-2c199564581d
```

## 🙊 Secrets

XCP-ng provides a secrets mechanism to avoid passwords being stored in plaintext in command-line history or on API objects. XenCenter uses this feature automatically and it can also be used from the xe CLI for any command that requires a password.

:::tip
Password secrets cannot be used to authenticate with a XCP-ng host from a remote instance of the xe CLI.
:::

To create a secret object, run the following command on your XCP-ng host.

```
xe secret-create value=my-password
```

A secret is created and stored on the XCP-ng host. The command outputs the UUID of the secret object. For example, `99945d96-5890-de2a-3899-8c04ef2521db`. Append `_secret` to the name of the password argument to pass this UUID to any command that requires a password.

Example: On the XCP-ng host where you created the secret, you can run the following command:

```
xe sr-create device-config:location=sr_address device-config:type=cifs device-config:username=cifs_username device-config:cifspassword_secret=secret_uuid name-label="CIFS ISO SR" type="iso" content-type="iso" shared="true"
```