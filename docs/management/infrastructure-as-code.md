# Infrastructure as code

You can use various 3rd party tools to manage your XCP-ng/XO stack "as code".

| Tool name        | Endpoint | Status         | Website       |
|------------------|----------|----------------|---------------|
| Packer XCP-ng    | XAPI     | Available      | [Link](https://github.com/ddelnano/packer-plugin-xenserver)        |   |
| Packer XO        | XO API   | Planned | Planned        |   |
| Terraform XO     | XO API   | Available      | [Link](https://registry.terraform.io/providers/terra-farm/xenorchestra/latest/docs)        |   |
| Ansible XO       | XO API   | Available      | [Link](https://docs.ansible.com/ansible/latest/collections/community/general/xen_orchestra_inventory.html)

## 📦 Packer

Packer is a free and open source tool for creating golden images for multiple platforms from a single source configuration. Combined with XCP-ng, you can create and regenerate templates for your own requirements or for your customers.

Here is a tutorial to start with Packer and XCP-ng: https://xcp-ng.org/blog/2024/02/22/using-packer-with-xcp-ng/


## 🌍 Terraform / OpenTofu

Terraform is an infrastructure as code software tool that enables you to safely and predictably create, change, and improve infrastructure. There's a series of blog posts to explain it in more details:

* https://xen-orchestra.com/blog/virtops1-xen-orchestra-terraform-provider/
* https://xen-orchestra.com/blog/managing-existing-infrastructure-with-terraform-2/

While Terraform used to be free and open-source, Hashicorp decided to relicense it. There is a free and open source fork called [OpenTofu](https://opentofu.org/) which can use Terraform's providers, though!

## 🏷️ Ansible

Ansible is a suite of software tools that enables infrastructure as code. It is open-source and the suite includes software provisioning, configuration management, and application deployment functionality

https://xen-orchestra.com/blog/virtops3-ansible-with-xen-orchestra/

## 🗃️ Netbox

[NetBox](https://netbox.dev/) is the leading solution for modeling and documenting modern networks. By combining the traditional disciplines of IP address management (IPAM) and datacenter infrastructure management (DCIM) with powerful APIs and extensions, NetBox provides the ideal "source of truth" to power network automation. Available as open source software under the Apache 2.0 license, NetBox is employed by thousands of organizations around the world.

You can even integrate a synchronization between Netbox and XCP-ng/XO:

https://xen-orchestra.com/blog/virtops-4-track-any-change-in-your-virtualized-infrastructure/
