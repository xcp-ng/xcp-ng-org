# Audit Evidence Collection via xe CLI   
A list of `xe` commands used to collect information required for compliance audit activities. Serves as a practical reference for extracting system data from XCP-ng hosts in a consistent and reproducible manner.

## Host & System Information   
- `xe host-list`: Enumerate all hosts in the pool.   
- `xe host-param-list uuid=<HOST\_UUID>`: Fetch detailed host properties such as OS version, patch level, and BIOS UUID.   
- `xe host-param-get uuid=<HOST\_UUID> param-name=<param\_name>` : Retrieve custom host attributes (e.g., cpu\_info, chipset-info).   
   
## Virtual Machine Configuration   
- `xe vm-list`: List all VMs, including hidden ones.   
- `xe vm-param-list uuid=<VM\_UUID>`    
- `xe vm-param-get uuid=<VM\_UUID> param-name=<param>`: Get a specific configuration information (domid, other-config, etc)   
- `xe vm-disk-list uuid=<VM\_UUID>`: Show all disks attached to a VM (VDI UUIDs, sizes).   
- `xe vif-list vm-uuid=<VM\_UUID>`: List VIFs (virtual NICs) attached to a VM, showing MAC addresses and networks.   
   
## Storage Repository & VDI   
- `xe sr-list`: Enumerate storage repositories.   
- `xe sr-param-list uuid=<SD\_UUID>`: Retrieve properties such as read‑only status, domain type, showing type and capacity.   
- `xe vdi-param-list uuid=<VDI\_UUID>`: List all parameters for a specific VDI in the environment.   
- `xe vdi-param-get uuid=<VDI\_UUID> param-name=<param>`: Get specific param of a VDI.   
- `xe sd-vdi-list uuid=<SD\_UUID>`: List all VDIs that belong to a particular storage domain.   
   
## Networking   
- `xe network-list`: Show all virtual networks.   
- `xe network-sriov-list`: List SR-IOV networks
- `xe network-param-list uuid=<NETWORK\_UUID>`: Retrieve network properties such as MTU or VLAN ID.   
- `xe vif-list vm-uuid=<VM\_UUID>`: List VIFs (virtual NICs) attached to a VM, showing MAC addresses and networks.   
   
## Roles   
XAPI supports roles and they can be queried directly, but in Vates VMS, RBAC is managed by Xen Orchestra (XO), which provides the main user and permission management layer.
- `xe role-list`: Enumerate all roles.   
- `xe role-param-list uuid=<ROLE\_UUID>`: Show role details.   
   
## Audit Logs   
- `xe audit-log-get since=<timpestamp\_ISO8601> filename=<dest\_file>` Retrieve all of the available records of the RBAC audit file in the pool. If the optional parameter `since` is present, it downloads only the records from that specific point in time.   
   
Example:   
`xe audit-log-get since=2026-06-11T00:00:00Z filename=/tmp/audit.log`   

## Certificates & Encryption   
- `xe certificate-list` : List all installed certificates.   
- `xe certificate-param-list uuid=<CERT\_UUID>` : Get detailed certificate metadata.   
- `xe host-param-get uuid=<CERT\_UUID>param-name=tls-verification-enabled` : Show TLS verification parameter for internal components   
   
## Log Locations on XCP-ng   
- `/var/log/xensource.log`: XAPI toolstack events and errors log.   
- `/var/log/audit.log`: RBAC audit records.   
- `/var/log/xenstored-access.log`: Read and write access on XenStore   
- `/var/log/messages`: Kernel and system messages.   
- `/var/log/secure`: SSH and PAM authentication logs.   
   
Others log files at [Log files](/troubleshooting/log-files) section.
   
## Further reading   
See [xe command reference](/appendix/cli_reference) section.
