# TLS certificate for XCP-ng

How to add a TLS certificate?

After installing XCP-ng, access to xapi via XCP-ng Center or Xen Orchestra is protected by TLS with a [self-signed certificate](https://en.wikipedia.org/wiki/Self-signed_certificate): this means that you have to either verify the certificate signature before allowing the connection (comparing against signature shown on the console of the server), either work on trust-on-first-use basis (i.e. assume that the first time you connect to the server, nobody is tampering with the connection).

If you would like to replace this certificate by a valid one, either from an internal Certificate Authority or from a public one, you'll find here some indications on how to do that.

Note that if you use an non-public certificate authority and XenOrchestra, you have [additional configuration to specify on Xen Orchestra side](https://xen-orchestra.com/docs/configuration.html#custom-certificate-authority).

## Generate certificate signing request

You can use the auto-generated key to create a certificate signing request:

```
openssl req -new -key /etc/xensource/xapi-ssl.pem -subj '/CN=XCP-ng hypervisor/' -out xcp-ng.csr
```

## Install the certificate chain (for XCP-ng v8.2+)

Once you have your certificates, upload the certificates to your XCP-ng host, then use the following command to install the certificates:

```
xe host-server-certificate-install certificate=<path to certificate> private-key=<path to key> certificate-chain=<path to chain>
```

:::tip
The `certificate-chain` parameter is optional. The private key can be deleted after certificate is installed for additional security. For additional details check Citrix [documentation](https://docs.citrix.com/en-us/citrix-hypervisor/hosts-pools.html#install-a-tls-certificate-on-your-server).
:::

Done! Visit your XCP-ng host ip using a browser and validate the certificate is correct.


## Install the certificate chain (for XCP-ng up to v8.1)

The certificate, intermediate certificates (if needed), certificate authority and private key are stored in `/etc/xensource/xapi-ssl.pem`, in that order. You have to replace all lines before `-----BEGIN RSA PRIVATE KEY----` with the certificate and the chain you got from your provider, using your favorite editor (`nano` is present on XCP-ng by default).

Then, you have to restart xapi :
```
systemctl restart xapi
```