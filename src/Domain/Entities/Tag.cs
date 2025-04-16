namespace Todo_App.Domain.Entities;

public class Tag : BaseAuditableEntity
{
    public string Name { get; set; } = null!;
    public Colour Color { get; set; } = Colour.Blue;

    public ICollection<TodoItemTag> TodoItemTags { get; set; } = new List<TodoItemTag>();
}
