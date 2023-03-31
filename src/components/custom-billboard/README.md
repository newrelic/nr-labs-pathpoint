# Custom Billboard

This custom billboard is used to replace the standard New Relic <strong>&lt;Billboard&gt;</strong> componentfor greater control over its functionality. You can use the custom billboard to show KPI's in any container. You need to import this component from <strong>"src/components/custom-billboard"</strong>.

```bash
    import CustomBillboard from '../../src/components/custom-billboard';
```

<strong>Note:</strong> Adjust the path relative to where the component is being called.

It requires 3 pieces of data as input:
- KPI name
- KPI value
- KPI value for a previous time range (or 0 if previous time range is not present)

Here is an example of how to invoke the billboard component:

```bash
    <CustomBillboard
      name={kpi.name}
      value={kpi.value}
      previousValue={kpi.previousValue}
    />
```
