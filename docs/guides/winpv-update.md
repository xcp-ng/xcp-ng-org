# Updating Windows PV drivers automatically with Group Policy

This page provides step-by-step instructions for deploying XCP-ng Windows guest tools using Group Policy Objects (GPO).
We provide an example of a staged rollout process for deploying first to a small set of VMs, then to the rest of the OU.

:::note
This procedure only supports XCP-ng Windows guest tools.
:::

## Setting up automatic installation

Create a new GPO and link it to your desired Active Directory organizational unit (OU):

![The New GPO dialog box, showing the "Install XCP-ng Tools" GPO being created.](../assets/img/winpv-update/gpo1.png)
![The new GPO, linked to the "Updates" OU.](../assets/img/winpv-update/gpo2.png)

To prevent the GPO from taking immediate effect, temporarily disable its link:

![The new GPO link's right-click menu, highlighting that "Link Enabled" is unchecked.](../assets/img/winpv-update/gpo3.png)

In **Computer Configuration** → **Policies** → **Software Settings** → **Software Installation**, add a new package:

![The Group Policy Management Editor showing how to add a new "Software Installation". Right-click the empty area of "Software installation", select "New" - "Package".](../assets/img/winpv-update/gpo4.png)

Select the installation MSI you want to install and click **OK**.
Here, we store the XCP-ng Windows Guest Tools on a shared folder under a DFS namespace:

![The Open dialog box showing the XenTools-x64.msi file, stored in a network share `\\tudinh.test\software\winpv`.](../assets/img/winpv-update/gpo5.png)

:::tip
- Once the installer path has been set, it cannot be changed.
- The installer must be stored on a network share with a stable location, reachable by all VMs.
  Setting up a network share is outside of this document's scope.
- To upgrade your guest tools to a newer version, do not replace the existing shared files.
  Instead, create a new shared package and use the Upgrades tab to replace the old one.
:::

In the **Deploy Software** dialog → **Select deployment method**, select **Assigned**. You can change this later.

![The Deploy Software dialog with "Assigned" selected.](../assets/img/winpv-update/gpo6.png)

The GPO is now configured. You can now close the GPO editor window.

![The Group Policy Management Editor showing the configured software installation. The "XCP-ng Windows Guest Tools" software installation entry is visible, with version 9.2, deployment method Assigned, and a path to the installer MSI as specified above.](../assets/img/winpv-update/gpo7.png)

## Staged rollout using GPO security filtering

In this section, we describe the procedure for staged rollouts of guest tools.
Using staged rollout, we can limit a tools deployment to a small group of VMs, then distribute it widely once the update looks good.

At this point, the GPO's link remains disabled, and no VM will apply it yet.

Create a security group for the first wave of VMs. In this example, we create a group named **Updates - Narrow distribution**:

![From Active Directory Users & Computers: the New Object - Group dialog creating "Updates - Narrow distribution".](../assets/img/winpv-update/rollout1.png)

Add the computer objects of the VMs you want to update first to this group:

![The Member Of tab of a computer object, showing "Updates - Narrow distribution" in "Member of".](../assets/img/winpv-update/rollout2.png)

In the GPO's **Scope** tab, under **Security Filtering**, remove **Authenticated Users**. Accept the warning:

![The GPO's Security Filtering list when removing Authenticated Users, with the Group Policy Management warning dialog visible below: "Group Policy requires each computer account to have permission..."](../assets/img/winpv-update/rollout3.png)

Add the **Updates - Narrow distribution** group to **Security Filtering**:

![Security Filtering listing only "Updates - Narrow distribution".](../assets/img/winpv-update/rollout4.png)

Enable the GPO link:

![The GPO link's right-click menu, highlighting that "Link Enabled" is checked.](../assets/img/winpv-update/rollout5.png)

Your GPO is now ready and enabled.
Targeted VMs will now pick up and install the driver package you selected on reboot.

## Observing the installation process

You'll need to reboot your VMs to apply the updates.
After reboot, the VMs will pick up on your new GPO and install the linked driver package.

![The Windows bootup showing "Installing managed software XCP-ng Windows Guest Tools…".](../assets/img/winpv-update/install1.png)

The VM will restart automatically after installing.

Once the update finishes, verify that the installation succeeded.

![Windows application list showing the installed tools version: XCP-ng Windows Guest Tools 9.2.350 (latest at the time of writing).](../assets/img/winpv-update/install2.png)

## Enabling wide distribution

When you are ready to deploy to all computers in the OU, add **Authenticated Users** back to **Security Filtering**:

![The GPO's Security Filtering listing both Authenticated Users and "Updates - Narrow distribution".](../assets/img/winpv-update/rollout6.png)

## Useful links

- If you want to remove existing Xen drivers, refer to the [XenClean guide](/vms/#fully-removing-xen-pv-drivers-with-xenclean).
- If you encounter VM boot issues after the update, refer to the [XenBootFix guide](/troubleshooting/windows-pv-tools/#windows-fails-to-boot-hangs-inaccessible_boot_device).
