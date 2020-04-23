# Storage in XCP-ng

## Storage types

There's 2 types of storage:

* Thin Provisioned: you only use the space your VM has filled with data
* Thick Provisioned: you use the space of your VMs disk(s) size.


<table>
  <tr>
    <th>Type of Storage Repository</th>
    <th>Name</th>
    <th>Thin Provisioned</th>
    <th>Thick Provisioned</th>
  </tr>
  <tr>
    <td rowspan="4">file based</td>
    <td>local Ext3/4</td>
    <td>X</td>
    <td></td>
  </tr>
  <tr>
    <td>NFS</td>
    <td>X</td>
    <td></td>
  </tr>
  <tr>
    <td>File</td>
    <td>X</td>
    <td></td>
  </tr>
  <tr>
    <td>XOSAN</td>
    <td>X</td>
    <td></td>
  </tr>
  <tr>
    <td rowspan="3">block based</td>
    <td>local LVM</td>
    <td></td>
    <td>X</td>
  </tr>
  <tr>
    <td>iSCSI</td>
    <td></td>
    <td>X</td>
  </tr>
  <tr>
    <td>HBA</td>
    <td></td>
    <td>X</td>
  </tr>
</table>

## Local

## NFS

## iSCSI

## HBA

## Glusterfs

## Ceph

## XOSANv2