# TLS certificate for XCP-ng

How to add a TLS certificate?

After installing XCP-ng, access to xapi via XCP-ng Center or Xen Orchestra is protected by TLS with a [self-signed certificate](https://en.wikipedia.org/wiki/Self-signed_certificate): this means that you have to either verify the certificate signature before allowing the connection (comparing against signature shown on the console of the server), either work on trust-on-first-use basis (i.e. assume that the first time you connect to the server, nobody is tampering with the connection).

If you would like to replace this certificate by a valid one, either from an internal Certificate Authority or from a public one, you'll find here some indications on how to do that.

Note that if you use an non-public certificate authority and XenOrchestra, you have [additional configuration to specify on Xen Orchestra side](https://xen-orchestra.com/docs/configuration.html#custom-certificate-authority).

## :memo: Generate certificate signing request {#generate-certificate-signing-request}

You can use the auto-generated key to create a certificate signing request:

<Terminal shell title="Generate certificate signing request">{`
openssl req -new -key /etc/xensource/xapi-ssl.pem -subj '/CN=XCP-ng hypervisor/' -out xcp-ng.csr
`}</Terminal>

## :link: Install the certificate chain (for XCP-ng v8.2+) {#install-the-certificate-chain-for-xcp-ng-v82}

Once you have your certificates, upload the certificates to your XCP-ng host, then use the following command to install the certificates:

<Terminal shell title="root@xcp-ng-host — Install the certificate chain…">{`
xe host-server-certificate-install certificate=<path to certificate> private-key=<path to key> certificate-chain=<path to chain>
`}</Terminal>

:::tip
The `certificate-chain` parameter is optional. The private key can be deleted after certificate is installed for additional security. For additional details check Citrix [documentation](https://docs.citrix.com/en-us/citrix-hypervisor/hosts-pools.html#install-a-tls-certificate-on-your-server).
:::

Done! Visit your XCP-ng host ip using a browser and validate the certificate is correct.


## :older_adult: Install the certificate chain (for XCP-ng up to v8.1) {#install-the-certificate-chain-for-xcp-ng-up-to-v81}

:::note
This information about deprecated releases is retained solely to assist with the transition to a supported release.
:::

The certificate, intermediate certificates (if needed), certificate authority and private key are stored in `/etc/xensource/xapi-ssl.pem`, in that order. You have to replace all lines before `-----BEGIN RSA PRIVATE KEY----` with the certificate and the chain you got from your provider, using your favorite editor (`nano` is present on XCP-ng by default).

Then, you have to restart xapi :

<Terminal shell title="Install the certificate chain (for XCP-ng up to…">{`
systemctl restart xapi
`}</Terminal>

## :shield: Pool certificate verification (XCP-ng 8.3) {#pool-certificate-verification}

Since XCP-ng 8.3, hosts of a pool can verify each other's TLS certificates. New pools have it enabled; on upgraded pools, enable it once every member runs 8.3:

<Terminal shell title="root@xcp-ng-host — Pool certificate verification…">{`
xe pool-enable-tls-verification
`}</Terminal>

Useful related commands:

<Terminal shell title="root@xcp-ng-host — Pool certificate verification…">{`
xe host-refresh-server-certificate host=<host>   # refresh the pool-internal identity certificates
xe host-reset-server-certificate host=<host>     # regenerate the host's self-signed server certificate
`}</Terminal>

Resetting or replacing a certificate (including with the procedure at the top of this page) is compatible with verification: XAPI redistributes the new certificate to the pool. XAPI raises alerts when certificates approach expiry, visible in Xen Orchestra.
