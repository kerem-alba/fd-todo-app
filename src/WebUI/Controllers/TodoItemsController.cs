using Microsoft.AspNetCore.Mvc;
using Todo_App.Application.Common.Models;
using Todo_App.Application.TodoItems.Commands.CreateTodoItem;
using Todo_App.Application.TodoItems.Commands.DeleteTodoItem;
using Todo_App.Application.TodoItems.Commands.UpdateTodoItem;
using Todo_App.Application.TodoItems.Commands.UpdateTodoItemDetail;
using Todo_App.Application.TodoItems.Queries.GetTodoItemsWithPagination;
using Todo_App.Application.TodoItems.Commands.AddTagToTodoItem;
using Todo_App.Application.TodoItems.Commands.RemoveTagFromTodoItem;
using Todo_App.Application.TodoItems.Queries.GetTagsOfTodoItem;
using Todo_App.Application.Tags.Queries.GetTags;

namespace Todo_App.WebUI.Controllers;

public class TodoItemsController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PaginatedList<TodoItemBriefDto>>> GetTodoItemsWithPagination([FromQuery] GetTodoItemsWithPaginationQuery query)
    {
        return await Mediator.Send(query);
    }

    [HttpPost]
    public async Task<ActionResult<int>> Create(CreateTodoItemCommand command)
    {
        return await Mediator.Send(command);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, UpdateTodoItemCommand command)
    {
        if (id != command.Id)
        {
            return BadRequest();
        }

        await Mediator.Send(command);

        return NoContent();
    }

    [HttpPut("[action]")]
    public async Task<ActionResult> UpdateItemDetails(int id, UpdateTodoItemDetailCommand command)
    {
        if (id != command.Id)
        {
            return BadRequest();
        }

        await Mediator.Send(command);

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        await Mediator.Send(new DeleteTodoItemCommand(id));

        return NoContent();
    }

    [HttpPost("{id}/tags")]
    public async Task<ActionResult> AddTag(int id, [FromBody] int tagId)
    {

        await Mediator.Send(new AddTagToTodoItemCommand(id, tagId));
        return NoContent();
    }

    [HttpDelete("{id}/tags/{tagId}")]
    public async Task<ActionResult> RemoveTag(int id, int tagId)
    {
        await Mediator.Send(new RemoveTagFromTodoItemCommand(id, tagId));
        return NoContent();
    }

    [HttpGet("{id}/tags")]
    public async Task<ActionResult<List<TagDto>>> GetTags(int id)
    {
        return await Mediator.Send(new GetTagsOfTodoItemQuery(id));
    }

}
