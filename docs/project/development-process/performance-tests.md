# Performance Tests

Basic ways to test XCP-ng performances.

- compare speed of write/read of disks in the old and in the new release
- compare speed of interfaces in the old and in the new release
- (add more here...)

## Example Storage Performance Tests Using fio

### Random write test for IOP/s, i.e. lots of small files

```shell
sync;fio --randrepeat=1 --ioengine=libaio --direct=1 --gtod_reduce=1 --name=test --filename=test --bs=4k --iodepth=64 --size=4G --readwrite=randwrite --ramp_time=4
```

### Random Read test for IOP/s, i.e. lots of small files

```shell
sync;fio --randrepeat=1 --ioengine=libaio --direct=1 --gtod_reduce=1 --name=test --filename=test --bs=4k --iodepth=64 --size=4G --readwrite=randread --ramp_time=4
```


### Sequential write test for throughput, i.e. one large file

```shell
sync;fio --randrepeat=1 --ioengine=libaio --direct=1 --gtod_reduce=1 --name=test --filename=test --bs=4M --iodepth=64 --size=4G --readwrite=write --ramp_time=4
```

### Sequential Read test for throughput, i.e. one large file

```shell
sync;fio --randrepeat=1 --ioengine=libaio --direct=1 --gtod_reduce=1 --name=test --filename=test --bs=4M --iodepth=64 --size=4G --readwrite=read --ramp_time=4
```

## VM Export / Import

* Export using ZSTD compression
* Import using ZSTD compression
* Export using gzip compression
* Import using gzip compression

## Guest tools and drivers

* Linux VM created on an older pool, with older guest tools not updated
* Update existing Linux guest tools
* Installation of guest tools on new Linux VM
* Windows VM from an upgraded pool, with older guest drivers not updated
* Update existing Windows guest drivers
* Installation of guest drivers on new Windows VM
