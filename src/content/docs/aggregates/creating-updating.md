---
title: Creating and updating aggregates
description: A guide for working with aggregates
---

## Creating new aggreagtes
### 1. Creating a new aggreagte with the aggregate factory
By providing the aggreagte type and aggreagte state its very simeple to create an aggregate:
```csharp
internal sealed class CreateAnAggreagte
{
    private readonly IAggreagteFactory _aggregateFactory;

    public CreateAnAggreagte(IAggreagteFactory aggregateFactory) => _aggregateFactory = aggregateFactory;

    public SampleAggregate Create()
        => _aggregateFactory.Create<SampleAggregate, SampleAggregateState>();
}
```
### 2. Saving the aggreagte with the aggreate store 
```csharp
internal sealed class CreateAndSaveAggreagte
{
    private readonly IAggreagteFactory _aggregateFactory;
    private readonly IAggregateStore<SampleAggregate, SampleAggregateState> _aggregateStore;

    public CreateAndSaveAggreagte(IAggreagteFactory aggregateFactory, IAggregateStore<SampleAggregate, SampleAggregateState> aggregateStore)
    {
        _aggregateFactory = aggregateFactory;
        _aggregateStore = aggregateStore;
    }

    public async Task CreateAndSaveAsync(CancellationToken cancellationToken)
    {
        var aggregate = _aggregateFactory.Create<SampleAggregate, SampleAggregateState>();
        aggregate.DoSomething();
        // This will save all uncommited events against the aggregate in the eventstore provided for this aggregate;
        await _aggregateStore.SaveAsync(aggregate, cancellationToken);
    }
}
```
## Updating aggregate
### 1. Retrieving an aggreagte with the aggreagte store
```csharp
internal sealed class GetAnAggreagte
{
    private readonly IAggregateStore<SampleAggregate, SampleAggregateState> _aggregateStore;

    public CreateAnAggreagte(IAggregateStore<SampleAggregate, SampleAggregateState> aggregateStore) => _aggregateStore = aggregateStore;

    public Task<SampleAggregate?> GetAsync(StreamId streamId, CancellationToken cancellationToken)
        => _aggregateFactory.GetAsync(streamId, cancellationToken);
}
```
### 2. Saving any changes
```csharp
internal sealed class UpdateAnAggreagte
{
    private readonly IAggregateStore<SampleAggregate, SampleAggregateState> _aggregateStore;

    public UpdateAnAggreagte(IAggregateStore<SampleAggregate, SampleAggregateState> aggregateStore) => _aggregateStore = aggregateStore;

    public Task<SampleAggregate?> UpdateAsync(StreamId streamId, CancellationToken cancellationToken)
    {
        var aggregate = _aggregateFactory.GetAsync(streamId, cancellationToken);
        aggreagte.DoSomethingElse();
        await _aggregateStore.SaveAsync(aggregate, cancellationToken);
    }
}
```