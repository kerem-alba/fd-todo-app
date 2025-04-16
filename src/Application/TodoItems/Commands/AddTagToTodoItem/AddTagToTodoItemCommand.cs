using MediatR;
using Todo_App.Application.Common.Interfaces;
using Todo_App.Domain.Entities;
using Todo_App.Application.Common.Exceptions;

namespace Todo_App.Application.TodoItems.Commands.AddTagToTodoItem;

public record AddTagToTodoItemCommand(int TodoItemId, int TagId) : IRequest;

public class AddTagToTodoItemCommandHandler : IRequestHandler<AddTagToTodoItemCommand>
{
    private readonly IApplicationDbContext _context;

    public AddTagToTodoItemCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(AddTagToTodoItemCommand request, CancellationToken cancellationToken)
    {
        var todoItem = await _context.TodoItems.FindAsync(new object[] { request.TodoItemId }, cancellationToken);
        var tag = await _context.Tags.FindAsync(new object[] { request.TagId }, cancellationToken);

        if (todoItem == null)
            throw new NotFoundException(nameof(TodoItem), request.TodoItemId);

        if (tag == null)
            throw new NotFoundException(nameof(Tag), request.TagId);

        var exists = _context.TodoItemTags.Any(t => t.TodoItemId == request.TodoItemId && t.TagId == request.TagId);
        if (!exists)
        {
            _context.TodoItemTags.Add(new TodoItemTag
            {
                TodoItemId = request.TodoItemId,
                TagId = request.TagId
            });

            await _context.SaveChangesAsync(cancellationToken);
        }

        return Unit.Value;
    }
}
