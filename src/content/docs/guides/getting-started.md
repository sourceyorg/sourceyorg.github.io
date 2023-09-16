---
title: Getting started
description: A guide for getting started with Sourcey.
---
:::caution
This guide uses the `InMemory` provider which is meant for development/demonstration, make sure you implement one of data providers for production  
:::
## Install the core nuget package
```
dotnet package add Sourcey
```

## Register Sourcey
### Add Sourcey to your DI container
``` csharp
Services.AddSourcey(builder => {...});

```

### Setting up events
#### 1. Create an event and inherit from the `Event` base class or implement the `IEvent` interface
```csharp
public record SomethingHappened(StreamId StreamId, int? Version, string Something)
    : Event(StreamId, Version)
```
#### 2. Register the event into cache
```csharp
Services.AddSourcey(builder =>
{
    ...
    builder.AddEvents(x =>
    {
        ...
        // This override will register all types in the runtime assembelies
        // that implement the IEvent interface.
        x.RegisterEventCache();
        // This override will register the cache for the generic constraint.
        x.RegisterEventCache<SomethingHappened>();
        // This override will register all types passed in (but will throw an error 
        // if any of the types do not implement the IEvent interface).
        x.RegisterEventCache(typeof(SomethingHappened), ...);

        x.WithInMemoryStore();
    });
});
```
### Setting up an aggregates
#### 1. Create an aggregate state implementing the `Iaggregatestate` interface
```csharp
public class SampleState: IAggregateState 
{
    public string? Something { get; set; }
    public SampleState() {}

    public SampleState(SampleState state)
    {
        Something = state.Something;
    }
}
```
#### 2. Create an aggregate using the `aggregate<TState>` base class
```csharp
public class Sampleaggregate: Aggregate<SampleState>
{
    public Sampleaggregate(SampleState state): base(state)
    {
        Handles<SomethingHappened>(@event =>
        {
            Id = @event.StreamId;
            _state.Something = @event.Something;
        });
    }

    public override SampleState GetState() => new(_state);

    public void MakeSomethingHappen(string something)
        => Apply(new SomethingHappened(
            StreamId: StreamId.New(),
            Version: Version.GetValueOrDefault() + 1,
            Something: something 
        ));
} 
```
#### 3. Register the aggregate.
```csharp
Services.AddSourcey(builder =>
{
    ...
    builder.AddAggregate<Sampleaggregate, SampleState>();
});
```
#### 4. Register the aggregate to an event store
```csharp
Services.AddSourcey(builder =>
{
    ...
    builder.AddEvents(e => 
    {
        ...
        e.WithInMemoryStore(x => 
        {
            // This override will register all types in the runtime assembelies
            // that inherit from the Aggregate<TState> base class.
            x.Addaggregates();
            // This override will register the generic constraint.
            x.AddAggregates<SampleAggregate>();
            // This override will register all types passed in (but will throw an error 
        // if any of the types do not inherit from the aggregate<TState> base class).
            x.AddAggregates(typeof(SampleAggregate), ...);
        });
    });
});
```
### Setting up a projection
#### 1. Create a projection and implement the `IProjection` interface
```csharp
public class Something : IProjection
{
    public string Subject { get; set; }
    public int? Version { get; set; }
    public string Value { get; set; }
} 
```
#### 2. Create a projection manager using the `ProjectionManager<TProjection>` base class or implement the `IProjectionManager<TProjection>` interface
```csharp
internal sealed class SomethingManager : ProjectionManager<Something>
{
    public SomethingManager(
        ILogger<SomethingManager> logger,
        IEnumerable<IProjectionWriter<Something>> projectionWriters,
        IEnumerable<IProjectionStateManager<Something>> projectionStateManagers) 
        : base(logger, projectionWriters, projectionStateManagers)
    {
        Handle<SomethingHappened>(OnSomethingHappenedAsync);
    }

    private async Task OnSomethingHappenedAsync(SomethingHappened @event, CancellationToken cancellationToken)
        => await AddAsync(@event.StreamId, () => new Something
        {
            Subject = @event.StreamId,
            Version = @event.Version.GetValueOrDefault(),
            Value = @event.Something
        }, cancellationToken);
}
```
#### 3. Register the projection
```csharp
Services.AddSourcey(builder =>
{
    ...
    builder.AddProjection<Something>(x =>
    {
        x.WithManager<SomethingManager>();
        x.WithInMemoryWriter();
        x.WithInMemoryStateManager();
    });
});
```
#### 4. Register the projection to an event store
```csharp
Services.AddSourcey(builder =>
{
    ...
    builder.AddEvents(e => 
    {
        ...
        e.WithInMemoryStore(x => 
        {
            // This override will register all types in the runtime assembelies
            // that Implement the IProjection interface.
            x.AddProjections();
            // This override will register the generic constraint.
            x.AddProjections<Something>();
            // This override will register all types passed in (but will throw an error 
            // if any of the types do not implement the IProjection interface).
            x.AddProjections(typeof(Something), ...);
        });
    });
});
```

### Setting up serialization
#### 1. Register default serialization
```csharp
Services.AddSourcey(builder =>
{
    ...
    builder.AddSerialization(x =>
    {
        x.WithEvents();
        x.WithAggregates();
    });
});
```
## Putting it all together
### Your registration should look something like this:
```csharp
Services.AddSourcey(builder =>
{
    builder.AddAggregate<Sampleaggregate, SampleState>();

    builder.AddEvents(e => 
    {
        e.RegisterEventCache<SomethingHappened>();
        e.WithInMemoryStore(x => 
        {
            x.AddAggregates<Sampleaggregate, SampleState>();
            x.AddProjections<Something>();
        });
    });

    builder.AddProjection<Something>(x =>
    {
        x.WithManager<SomethingManager>();
        x.WithInMemoryWriter();
        x.WithInMemoryStateManager();
    });

    builder.AddSerialization(x =>
    {
        x.WithEvents();
        x.WithAggregates();
    });
});
```

:::tip
See the source code for this [here](https://github.com/sourceyorg/sourcey/tree/main/samples/InMemory)
:::